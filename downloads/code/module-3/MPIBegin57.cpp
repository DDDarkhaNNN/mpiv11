// MPIBegin57. Максимумы от ранга 0 до текущего ранга.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    int count = size + 5;
    return numbers(label(rank) + "введите чисел: " + std::to_string(count) + " (целые, через пробел): ", count, count, true);
}

void solve(int rank, int size, const Row& row) {
    auto local = valuesOf<int>(row);
    std::vector<int> result(size + 5);
    MPI_Scan(local.data(), result.data(), size + 5, MPI_INT, MPI_MAX, MPI_COMM_WORLD);
    printValues(rank, result);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin57. Максимумы от ранга 0 до текущего ранга.", InputRanks::all, 1, false, false, readInput, solve};
    return run(argc, argv, task);
}
