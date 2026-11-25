#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    return numbers(label(rank) + std::to_string(size) + " вещественных чисел, по одному каждому рангу: ",
                   size, size, false);
}

void solve(int rank, int size, const Row& row) {
    std::vector<double> send = valuesOf<double>(row), received(size);
    MPI_Alltoall(send.data(), 1, MPI_DOUBLE, received.data(), 1, MPI_DOUBLE, MPI_COMM_WORLD);
    printValues(rank, received);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin43. MPI_Alltoall: по одному числу от каждого источника.",
                 InputRanks::all, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
