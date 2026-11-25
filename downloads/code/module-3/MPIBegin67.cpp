// MPIBegin67. Упаковка и рассылка троек.
#include "console_mpi.hpp"
#include <cctype>
#include <cmath>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using namespace console_mpi;

bool isStrictInt(const std::string& token) {
    if (token.empty()) return false;
    std::size_t i = (token[0] == '+' || token[0] == '-') ? 1 : 0;
    if (i == token.size()) return false;
    for (; i < token.size(); ++i) {
        if (!std::isdigit(static_cast<unsigned char>(token[i]))) return false;
    }
    try {
        std::size_t pos = 0;
        (void)std::stoi(token, &pos);
        return pos == token.size();
    } catch (...) {
        return false;
    }
}

bool isStrictReal(const std::string& token) {
    if (token.empty()) return false;
    std::size_t i = (token[0] == '+' || token[0] == '-') ? 1 : 0;
    std::size_t dotPos = token.find('.', i);
    // Обязательно должна быть точка и цифры по обе стороны от неё (целые вроде "5" не пройдут)
    if (dotPos == std::string::npos || dotPos == i || dotPos + 1 == token.size()) return false;
    for (std::size_t j = i; j < token.size(); ++j) {
        if (j == dotPos) continue;
        if (!std::isdigit(static_cast<unsigned char>(token[j]))) return false;
    }
    try {
        std::size_t pos = 0;
        double value = std::stod(token, &pos);
        return pos == token.size() && std::isfinite(value);
    } catch (...) {
        return false;
    }
}

Row readInput(int rank, int size, const Rows&) {
    int triples = size - 1;
    int total = triples * 3;

    while (true) {
        Row row = readLine(label(rank) + "троек: " + std::to_string(triples)
            + ", порядок: целое, вещественное, целое, всего чисел: " + std::to_string(total) + ": ");
        if (row.empty()) continue;

        if (static_cast<int>(row.size()) != total) {
            std::cout << "Ошибка: нужно ввести ровно " << total
                      << " чисел (введено " << row.size() << "). Повторите ввод.\n";
            continue;
        }

        bool ok = true;
        for (int t = 0; t < triples; ++t) {
            int base = t * 3;

            if (!isStrictInt(row[base + 0])) {
                std::cout << "Ошибка: в тройке " << (t + 1)
                          << " на 1-й позиции ожидается ЦЕЛОЕ число, а введено \""
                          << row[base + 0] << "\". Повторите ввод.\n";
                ok = false;
                break;
            }

            if (!isStrictReal(row[base + 1])) {
                std::cout << "Ошибка: в тройке " << (t + 1)
                          << " на 2-й позиции ожидается ВЕЩЕСТВЕННОЕ число с точкой (например, 4.2), а введено \""
                          << row[base + 1] << "\". Повторите ввод.\n";
                ok = false;
                break;
            }

            if (!isStrictInt(row[base + 2])) {
                std::cout << "Ошибка: в тройке " << (t + 1)
                          << " на 3-й позиции ожидается ЦЕЛОЕ число, а введено \""
                          << row[base + 2] << "\". Повторите ввод.\n";
                ok = false;
                break;
            }
        }

        if (ok) return row;
    }
}

void packTriple(const Row& row, int start, char* packet, int capacity) {
    int position = 0;
    int first = std::stoi(row.at(start + 0));
    MPI_Pack(&first, 1, MPI_INT, packet, capacity, &position, MPI_COMM_WORLD);
    double real = std::stod(row.at(start + 1));
    MPI_Pack(&real, 1, MPI_DOUBLE, packet, capacity, &position, MPI_COMM_WORLD);
    int second = std::stoi(row.at(start + 2));
    MPI_Pack(&second, 1, MPI_INT, packet, capacity, &position, MPI_COMM_WORLD);
}

std::string unpackTriple(char* packet, int capacity) {
    int position = 0;
    int first = 0, second = 0;
    double real = 0.0;
    MPI_Unpack(packet, capacity, &position, &first, 1, MPI_INT, MPI_COMM_WORLD);
    MPI_Unpack(packet, capacity, &position, &real, 1, MPI_DOUBLE, MPI_COMM_WORLD);
    MPI_Unpack(packet, capacity, &position, &second, 1, MPI_INT, MPI_COMM_WORLD);
    return std::to_string(first) + " " + decimal(real) + " " + std::to_string(second);
}

void solve(int rank, int size, const Row& row) {
    int intBytes = 0, realBytes = 0;
    MPI_Pack_size(1, MPI_INT, MPI_COMM_WORLD, &intBytes);
    MPI_Pack_size(1, MPI_DOUBLE, MPI_COMM_WORLD, &realBytes);
    int width = 2 * intBytes + realBytes;

    std::vector<char> packets(size * width, 0);
    std::vector<char> local(width, 0);

    if (rank == 0) {
        for (int r = 1; r < size; ++r) {
            packTriple(row, (r - 1) * 3, packets.data() + r * width, width);
        }
    }

    MPI_Scatter(packets.data(), width, MPI_PACKED,
                local.data(), width, MPI_PACKED,
                0, MPI_COMM_WORLD);

    if (rank != 0) answer(rank, unpackTriple(local.data(), width));
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin67. Упаковка и рассылка троек.", InputRanks::root, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
