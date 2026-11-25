#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    for (;;) {
        Row row = numbers(label(rank) + "N (1 или 2) и целое A: ", 2, 2, true);
        if (row[0] == "1" || row[0] == "2") return row;
        std::cout << "Ошибка: первое число N должно быть 1 или 2. Повторите строку.\n";
    }
}

bool valid(const Rows& rows) {
    bool one = false, two = false;
    for (const Row& row : rows) {
        one |= row.at(0) == "1";
        two |= row.at(0) == "2";
    }
    if (one && two) return true;
    std::cout << "Ошибка: нужны процессы с N=1 и с N=2. Начните ввод заново с числа процессов.\n";
    return false;
}

void solve(int rank, int, const Row& row) {
    MPI_Comm subgroup;
    MPI_Comm_split(MPI_COMM_WORLD, std::stoi(row.at(0)), rank, &subgroup);
    int count;
    MPI_Comm_size(subgroup, &count);
    int value = valuesOf<int>(Row{row.at(1)}).at(0);
    std::vector<int> received(count);
    MPI_Allgather(&value, 1, MPI_INT, received.data(), 1, MPI_INT, subgroup);
    printValues(rank, received);
    MPI_Comm_free(&subgroup);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin80. Числа каждой группы N=1 или N=2 всем внутри группы.",
                 InputRanks::all, 2, false, false, readInput, solve, valid};
    return run(argc, argv, task);
}
