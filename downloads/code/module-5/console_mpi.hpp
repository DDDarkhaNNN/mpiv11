#pragma once
// Ввод из CMD и запуск mpiexec. Алгоритм каждой задачи находится в её .cpp.
#include <windows.h>
#include <process.h>
#include <mpi.h>
#include <algorithm>
#include <type_traits>
#include <cstddef>
#include <charconv>
#include <cmath>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

namespace console_mpi {
using Row = std::vector<std::string>;
using Rows = std::vector<Row>;
struct EndOfInput {};

// Одна строка консоли всегда соответствует одному ответу.
inline Row readLine(const std::string& prompt) {
    std::cout << prompt << std::flush;
    std::string line;
    if (!std::getline(std::cin, line)) throw EndOfInput{};
    std::istringstream input(line);
    Row row;
    for (std::string token; input >> token;) row.push_back(token);
    if (row == Row{"q"}) throw EndOfInput{};
    return row;
}

template<class T>
inline bool numeric(const std::string& token, T& value) {
    const char* first = token.data();
    const char* last = first + token.size();
    if (first != last && *first == '+') {
        ++first;
        if (first == last || *first == '-' || *first == '+') return false;
    }
    auto parsed = std::from_chars(first, last, value);
    return parsed.ec == std::errc{} && parsed.ptr == last && std::isfinite(static_cast<double>(value));
}

// Вещественное значение при ручном вводе записывается с точкой: 2.0, -0.5.
inline bool strictReal(const std::string& token, double& value) {
    size_t i = 0;
    if (i < token.size() && (token[i] == '+' || token[i] == '-')) ++i;
    const size_t whole = i;
    while (i < token.size() && token[i] >= '0' && token[i] <= '9') ++i;
    if (i == whole || i == token.size() || token[i] != '.') return false;
    ++i;
    const size_t fraction = i;
    while (i < token.size() && token[i] >= '0' && token[i] <= '9') ++i;
    return i > fraction && i == token.size() && numeric(token, value);
}

inline std::string decimal(double x) {
    char buf[64];
    auto end = std::to_chars(buf, buf + sizeof(buf), x, std::chars_format::general);
    return std::string(buf, end.ptr);
}

inline double unpackReal(const std::string& token) {
    double value;
    const char* end = token.data() + token.size();
    auto converted = std::from_chars(token.data(), end, value);
    if (converted.ec != std::errc{} || converted.ptr != end) throw std::invalid_argument("A");
    return value;
}

inline bool normalize(Row& row, size_t first, bool integers) {
    for (size_t i = first; i < row.size(); ++i) {
        if (integers) {
            int value;
            if (!numeric(row[i], value)) return false;
            row[i] = std::to_string(value);
        } else {
            double value;
            if (!numeric(row[i], value)) return false;
            row[i] = decimal(value);
        }
    }
    return true;
}

inline std::string label(int rank) {
    return "Ранг " + std::to_string(rank) + " — ";
}

inline Row numbers(const std::string& prompt, size_t low, size_t high, bool integers) {
    for (;;) {
        Row row = readLine(prompt);
        if (row.size() < low || row.size() > high) {
            std::cout << "Ошибка: ожидалось " << low;
            if (low != high) std::cout << ".." << high;
            std::cout << " чисел, получено " << row.size() << ". Повторите строку.\n";
            continue;
        }
        bool valid = true;
        for (size_t i = 0; i < row.size(); ++i) {
            if (integers) {
                int value;
                valid = numeric(row[i], value);
                if (valid) row[i] = std::to_string(value);
            } else {
                double value;
                valid = strictReal(row[i], value);
                if (valid) row[i] = decimal(value);
            }
            if (!valid) {
                std::cout << "Ошибка: число №" << i + 1 << " должно быть "
                          << (integers ? "целым (например, 2)" : "вещественным с точкой (например, 2.0)")
                          << ". Введено: \"" << row[i] << "\". Повторите строку.\n";
                break;
            }
        }
        if (valid) return row;
    }
}

inline Row numbered(int rank, const Rows& rows, int low, int high, const std::string& field) {
    const std::string prompt = label(rank) + "число A и " + field + " (" +
        std::to_string(low) + ".." + std::to_string(high) + "): ";
    for (;;) {
        Row row = readLine(prompt);
        int n;
        double value;
        if (row.size() != 2 || !numeric(row[0], value) || !numeric(row[1], n) || n < low || n > high) {
            std::cout << "Введите два числа в указанном порядке. Второе должно быть целым из указанного диапазона.\n";
            continue;
        }
        const auto number = std::to_string(n);
        bool used = std::any_of(rows.begin(), rows.end(), [&](const Row& other) {
            return other.size() == 2 && other[1] == number;
        });
        if (!used) return {decimal(value), number};
        std::cout << "Этот номер уже использован. Повторите строку с другим номером.\n";
    }
}

inline void answer(int rank, const std::string& value) {
    std::string line = "Ответ ранга " + std::to_string(rank) + ": " + value + "\n";
    std::cout << line << std::flush;
}

inline std::string join(const Row& row) {
    std::string result;
    for (const auto& s : row) {
        if (!result.empty()) result += ' ';
        result += s;
    }
    return result.empty() ? "(пусто)" : result;
}

// При отправке себе блокирующий MPI_Send должен иметь встречный MPI_Recv.
// Оба вызова выполняет один MPI-процесс, но разные потоки.
template<class T>
inline void transferSelf(T& value, T& received, MPI_Datatype type, int rank,
                         int source, MPI_Status& status) {
    std::thread receiver([&] {
        MPI_Recv(&received, 1, type, source, 0, MPI_COMM_WORLD, &status);
    });
    MPI_Send(&value, 1, type, rank, 0, MPI_COMM_WORLD);
    receiver.join();
}

inline int launch(const Rows& rows) {
    std::wstring path(32768, L'\0');
    DWORD length = GetModuleFileNameW(nullptr, path.data(), static_cast<DWORD>(path.size()));
    if (!length || length >= path.size()) throw std::runtime_error("Не удалось определить путь к программе.");
    path.resize(length);
    std::vector<std::wstring> args = {L"mpiexec.exe", L"-n", std::to_wstring(rows.size()),
                                      L"\"" + path + L"\"", L"--mpi"};
    for (const Row& row : rows) {
        std::wstring packed;
        for (const auto& token : row) {
            if (!packed.empty()) packed += L',';
            packed.append(token.begin(), token.end());
        }
        args.push_back(packed.empty() ? L"_" : packed);
    }
    std::vector<const wchar_t*> argv;
    for (const auto& arg : args) argv.push_back(arg.c_str());
    argv.push_back(nullptr);
    std::cout << std::flush;
    auto code = _wspawnvp(_P_WAIT, L"mpiexec.exe", argv.data());
    if (code == -1) throw std::runtime_error("Не удалось запустить mpiexec.exe (MPI).");
    return static_cast<int>(code);
}

enum class InputRanks { all, root, workers };
struct Task {
    const char* title;
    InputRanks inputs;
    int minimum;
    bool even;
    bool threaded;
    Row (*read)(int rank, int size, const Rows&);
    void (*solve)(int rank, int size, const Row&);
    bool (*valid)(const Rows&) = nullptr;
    bool (*sizeValid)(int) = nullptr;
};

inline int mpiMain(int argc, char** argv, const Task& task) {
    int provided;
    MPI_Init_thread(&argc, &argv, task.threaded ? MPI_THREAD_MULTIPLE : MPI_THREAD_SINGLE, &provided);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    if (argc != size + 2 || (task.threaded && provided < MPI_THREAD_MULTIPLE)) {
        if (rank == 0) std::cerr << "Проверьте аргументы запуска и поддержку потоков в MPI.\n";
        MPI_Finalize();
        return 1;
    }
    Row row;
    std::string encoded = argv[2 + rank];
    if (encoded != "_") {
        std::istringstream tokens(encoded);
        std::string token;
        while (std::getline(tokens, token, ',')) row.push_back(token);
    }
    try {
        task.solve(rank, size, row);
    } catch (const std::exception& error) {
        std::cerr << "Ошибка в ранге " << rank << ": " << error.what() << std::endl;
        MPI_Abort(MPI_COMM_WORLD, 2);
        return 2;
    }
    MPI_Finalize();
    return 0;
}

inline int run(int argc, char** argv, const Task& task) {
    SetConsoleOutputCP(CP_UTF8);
    if (argc >= 2 && std::string(argv[1]) == "--mpi") return mpiMain(argc, argv, task);
    std::cout << task.title << '\n';
    try {
        for (;;) {
            int size;
            for (;;) {
                Row line = readLine("\nСколько всего процессов (" + std::to_string(task.minimum) + "..13, -1 для выхода)? ");
                if (line == Row{"-1"}) return 0;
                if (line.size() != 1 || !numeric(line[0], size) || size < task.minimum || size > 13) {
                    std::cout << "Ошибка: введите одно целое число процессов в указанном диапазоне.\n";
                    continue;
                }
                if ((task.even && size % 2 != 0) || (task.sizeValid && !task.sizeValid(size))) {
                    std::cout << "Ошибка: число процессов не соответствует условию этой задачи. Повторите ввод.\n";
                    continue;
                }
                break;
            }
            Rows rows(size);
            int first = task.inputs == InputRanks::workers ? 1 : 0;
            int end = task.inputs == InputRanks::root ? 1 : size;
            for (int rank = first; rank < end; ++rank)
                rows[rank] = task.read(rank, size, rows);
            if (task.valid && !task.valid(rows)) continue;
            std::cout << "\nОбмен через MPI:\n";
            int code = launch(rows);
            if (code) return code;
        }
    } catch (const EndOfInput&) {
        return 0;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}
template<class T>
inline std::vector<T> valuesOf(const Row& row) {
    std::vector<T> values;
    for (const auto& token : row) {
        T value;
        if (!numeric(token, value)) throw std::invalid_argument("Некорректное число");
        values.push_back(value);
    }
    return values;
}

template<class T>
inline void printValues(int rank, const std::vector<T>& values) {
    Row tokens;
    for (T value : values) {
        if constexpr (std::is_integral_v<T>) tokens.push_back(std::to_string(value));
        else tokens.push_back(decimal(value));
    }
    answer(rank, join(tokens));
}

inline Row mixedTriples(int rank, int count, int realIndex, const std::string& realLabel = "дробное") {
    const std::string format = realIndex == 1 ? "целое, " + realLabel + ", целое" : "целое, целое, " + realLabel;
    for (;;) {
        Row row = readLine(label(rank) + "троек: " + std::to_string(count) +
            ", порядок: " + format + ", всего чисел: " + std::to_string(3 * count) + ": ");
        if (static_cast<int>(row.size()) != 3 * count) {
            std::cout << "Ошибка: ожидалось " << 3 * count << " чисел, получено "
                      << row.size() << ". Повторите строку.\n";
            continue;
        }
        bool valid = true;
        for (int i = 0; i < static_cast<int>(row.size()); ++i) {
            double real;
            int integer;
            valid = i % 3 == realIndex ? strictReal(row[i], real) : numeric(row[i], integer);
            if (!valid) {
                std::cout << "Ошибка: тройка " << i / 3 + 1 << ", число №" << i % 3 + 1
                          << " должно быть "
                          << (i % 3 == realIndex ? "вещественным с точкой (например, 2.0)" : "целым (например, 2)")
                          << ". Введено: \"" << row[i] << "\". Повторите строку.\n";
                break;
            }
        }
        if (valid) return row;
    }
}
}
