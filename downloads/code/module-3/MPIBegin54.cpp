// MPIBegin54. Два максимума для каждого ранга.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    int count = 2 * size;
    return numbers(label(rank) + "введите чисел: " + std::to_string(count) + " (вещественные, через пробел): ", count, count, false);
}

void solve(int rank, int size, const Row& row) {
    auto local = valuesOf<double>(row);
    std::vector<double> result(2);
    std::vector<int> counts(size, 2);
    MPI_Reduce_scatter(local.data(), result.data(), counts.data(), MPI_DOUBLE, MPI_MAX, MPI_COMM_WORLD);
    printValues(rank, result);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin54. Два максимума для каждого ранга.", InputRanks::all, 1, false, false, readInput, solve};
    return run(argc, argv, task);
}
