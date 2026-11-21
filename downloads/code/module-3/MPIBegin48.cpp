// MPIBegin48. Суммы элементов с одинаковыми номерами.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    int count = size + 5;
    return numbers(label(rank) + "введите чисел: " + std::to_string(count) + " (целые, через пробел): ", count, count, true);
}

void solve(int rank, int size, const Row& row) {
    auto local = valuesOf<int>(row);
    std::vector<int> result(size + 5);
    MPI_Reduce(local.data(), result.data(), size + 5, MPI_INT, MPI_SUM, 0, MPI_COMM_WORLD);
    if (rank == 0) printValues(rank, result);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin48. Суммы элементов с одинаковыми номерами.", InputRanks::all, 1, false, false, readInput, solve};
    return run(argc, argv, task);
}
