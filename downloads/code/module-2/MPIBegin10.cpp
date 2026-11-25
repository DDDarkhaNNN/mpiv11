// MPIBegin10, М. Э. Абрамян. Сборка для Windows, C++17 + Microsoft MPI.
// При обычном запуске собираем ввод для процессов. Ключ --mpi использует mpiexec.
#include <windows.h>
#include <process.h>
#include <mpi.h>
#include <array>
#include <charconv>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

constexpr int maxLength = 4;
constexpr int maxRanks = 12;
using Batch = std::array<int, maxLength>;

int runMpi(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    MPI_Comm comm = MPI_COMM_WORLD;
    int rank, size;
    MPI_Comm_rank(comm, &rank);
    MPI_Comm_size(comm, &size);
    if (argc != 2 + (size - 1) * (1 + maxLength)) {
        if (rank == 0) std::cerr << "Неверное число входных наборов.\n";
        MPI_Finalize();
        return 1;
    }

    if (rank == 0) {
        std::vector<int> answer;
        for (int source = 1; source < size; ++source) {
            Batch received{};
            MPI_Status status;
            MPI_Recv(received.data(), maxLength, MPI_INT, source, 0, comm, &status);

            int count;
            MPI_Get_count(&status, MPI_INT, &count);
            std::cout << "От ранга " << source << " (N = " << count << "):";
            for (int i = 0; i < count; ++i) {
                std::cout << ' ' << received[i];
                answer.push_back(received[i]);
            }
            std::cout << '\n';
        }
        std::cout << "Ответ ранга 0:";
        if (answer.empty()) std::cout << " (пусто)";
        for (int value : answer) std::cout << ' ' << value;
        std::cout << std::endl;
    } else {
        // Пусковая часть передаёт каждому рангу N и четыре места для чисел.
        // В MPI-сообщение входят только первые N элементов.
        int offset = 2 + (rank - 1) * (1 + maxLength);
        int n;
        Batch values{};
        try {
            n = std::stoi(argv[offset]);
            if (n < 1 || n > maxLength) throw std::out_of_range("N");
            for (int i = 0; i < n; ++i)
                values[i] = std::stoi(argv[offset + 1 + i]);
        } catch (const std::exception&) {
            MPI_Abort(comm, 2);
            return 2;
        }

        int packed;
        MPI_Pack_size(n, MPI_INT, comm, &packed);
        int bytes = packed + MPI_BSEND_OVERHEAD;
        std::vector<char> buffer(bytes);
        MPI_Buffer_attach(buffer.data(), bytes);
        MPI_Bsend(values.data(), n, MPI_INT, 0, 0, comm);
        void* released = nullptr;
        MPI_Buffer_detach(&released, &bytes);
    }
    MPI_Finalize();
    return 0;
}

struct EndOfInput {};

std::string readLine(const std::string& prompt) {
    std::cout << prompt << std::flush;
    std::string line;
    if (!std::getline(std::cin, line) || line == "q") throw EndOfInput{};
    return line;
}

bool strictInt(const std::string& token, int& value) {
    const char* first = token.data();
    const char* last = first + token.size();
    if (first != last && *first == '+') ++first;
    if (first == last || *first == '+') return false;
    auto parsed = std::from_chars(first, last, value);
    return parsed.ec == std::errc{} && parsed.ptr == last;
}

int processCount() {
    for (;;) {
        std::istringstream input(readLine("\nСколько всего процессов (1..12, -1 для выхода)? "));
        int count;
        std::string token, extra;
        if ((input >> token) && !(input >> extra) && strictInt(token, count)) {
            if (count == -1) throw EndOfInput{};
            if (count >= 1 && count <= maxRanks) return count;
        }
        std::cout << "Ошибка: введите одно целое число от 1 до 12 или -1 для выхода.\n";
    }
}

int readBatch(int rank, Batch& values) {
    for (;;) {
        std::istringstream input(readLine("Ранг " + std::to_string(rank) + " — введите числа: "));
        int n = 0;
        std::string token;
        bool valid = true;
        while (input >> token) {
            int x;
            if (n >= maxLength) {
                std::cout << "Ошибка: можно ввести от 1 до 4 чисел. Повторите строку.\n";
                valid = false;
                break;
            }
            if (!strictInt(token, x)) {
                std::cout << "Ошибка: число №" << n + 1
                          << " должно быть целым (например, 2). Введено: \""
                          << token << "\". Повторите строку.\n";
                valid = false;
                break;
            }
            values[n++] = x;
        }
        if (valid && n > 0) return n;
        if (valid) std::cout << "Ошибка: введите от 1 до 4 целых чисел через пробел.\n";
    }
}

int launch(const std::vector<Batch>& batches, const std::vector<int>& lengths) {
    // Абсолютный путь нужен и при запуске из другой папки или с пробелами в пути.
    std::wstring path(32768, L'\0');
    DWORD length = GetModuleFileNameW(nullptr, path.data(), static_cast<DWORD>(path.size()));
    if (length == 0 || length >= path.size())
        throw std::runtime_error("Не удалось определить путь к программе.");
    path.resize(length);
    std::vector<std::wstring> args = {L"mpiexec.exe", L"-n", std::to_wstring(batches.size()),
                                      L"\"" + path + L"\"", L"--mpi"};
    for (size_t rank = 1; rank < batches.size(); ++rank) {
        args.push_back(std::to_wstring(lengths[rank]));
        for (int value : batches[rank]) args.push_back(std::to_wstring(value));
    }
    std::vector<const wchar_t*> pointers;
    for (const auto& arg : args) pointers.push_back(arg.c_str());
    pointers.push_back(nullptr);
    std::cout << std::flush;
    auto code = _wspawnvp(_P_WAIT, L"mpiexec.exe", pointers.data());
    if (code == -1) throw std::runtime_error("Не удалось запустить mpiexec.exe из Microsoft MPI.");
    return static_cast<int>(code);
}

int main(int argc, char** argv) {
    SetConsoleOutputCP(CP_UTF8);
    if (argc >= 2 && std::string(argv[1]) == "--mpi") return runMpi(argc, argv);

    std::cout << "MPIBegin10. Ранг 0 собирает наборы от остальных рангов.\n";
    try {
        while (true) {
            int size = processCount();
            std::vector<Batch> batches(size, Batch{});
            std::vector<int> lengths(size, 0);
            if (size > 1) {
                std::cout << "Ранг 0 получает данные. Для каждого отправителя введите от 1 до 4 "
                             "целых чисел в одной строке. Например: 4 5\n";
            }
            for (int rank = 1; rank < size; ++rank)
                lengths[rank] = readBatch(rank, batches[rank]);
            std::cout << "\nРанг 0 получил наборы по порядку:\n" << std::flush;
            int rc = launch(batches, lengths);
            if (rc != 0) {
                std::cerr << "Ошибка запуска MPI, код " << rc << ".\n";
                return rc;
            }
        }
    } catch (const EndOfInput&) {
        return 0;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
    return 0;
}
