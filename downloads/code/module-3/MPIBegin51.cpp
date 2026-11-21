// MPIBegin51. Произведения элементов с одинаковыми номерами.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    int count = size + 5;
    return numbers(label(rank) + "введите чисел: " + std::to_string(count) + " (вещественные, через пробел): ", count, count, false);
}

void solve(int rank, int size, const Row& row) {
    auto local = valuesOf<double>(row);
    std::vector<double> result(size + 5);
    MPI_Allreduce(local.data(), result.data(), size + 5, MPI_DOUBLE, MPI_PROD, MPI_COMM_WORLD);
    printValues(rank, result);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin51. Произведения элементов с одинаковыми номерами.", InputRanks::all, 1, false, false, readInput, solve};
    return run(argc, argv, task);
}
