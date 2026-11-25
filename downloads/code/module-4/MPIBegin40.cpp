#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return numbers(label(rank) + "одно вещественное число: ", 1, 1, false);
}

void solve(int rank, int size, const Row& row) {
    double send = valuesOf<double>(row).at(0);
    std::vector<double> received(size);
    MPI_Allgather(&send, 1, MPI_DOUBLE, received.data(), 1, MPI_DOUBLE, MPI_COMM_WORLD);
    printValues(rank, received);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin40. MPI_Allgather: число каждого процесса всем процессам.",
                 InputRanks::all, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
