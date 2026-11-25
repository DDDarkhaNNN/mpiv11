#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    for (;;) {
        Row row = readLine(label(rank) + "N (0 или 1); при N=1 добавьте вещественное A: ");
        if (row.empty() || (row[0] != "0" && row[0] != "1")) {
            std::cout << "Ошибка: первое число N должно быть целым 0 или 1. Повторите строку.\n";
            continue;
        }
        const size_t expected = row[0] == "1" ? 2 : 1;
        if (row.size() != expected) {
            std::cout << "Ошибка: при N=" << row[0] << " ожидается " << expected
                      << " чисел. Повторите строку.\n";
            continue;
        }
        if (expected == 2) {
            double value;
            if (!strictReal(row[1], value)) {
                std::cout << "Ошибка: число A должно быть вещественным с точкой (например, 2.0). Повторите строку.\n";
                continue;
            }
            row[1] = decimal(value);
        }
        return row;
    }
}

bool valid(const Rows& rows) {
    for (const Row& row : rows) if (row.at(0) == "1") return true;
    std::cout << "Ошибка: нужен хотя бы один ранг с N=1. Начните ввод заново с числа процессов.\n";
    return false;
}

void solve(int rank, int, const Row& row) {
    const bool included = row.at(0) == "1";
    MPI_Comm subgroup;
    MPI_Comm_split(MPI_COMM_WORLD, included ? 1 : MPI_UNDEFINED, rank, &subgroup);
    if (included) {
        int count;
        MPI_Comm_size(subgroup, &count);
        double value = unpackReal(row.at(1));
        std::vector<double> received(count);
        MPI_Gather(&value, 1, MPI_DOUBLE, received.data(), 1, MPI_DOUBLE, 0, subgroup);
        int localRank;
        MPI_Comm_rank(subgroup, &localRank);
        if (localRank == 0) printValues(rank, received);
        MPI_Comm_free(&subgroup);
    }
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin77. Числа рангов с N=1 первому из этих рангов.",
                 InputRanks::all, 2, false, false, readInput, solve, valid};
    return run(argc, argv, task);
}
