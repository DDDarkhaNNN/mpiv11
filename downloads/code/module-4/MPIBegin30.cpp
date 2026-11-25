#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int, int, const Rows&) {
    return numbers("Ранг 0 — одно целое число: ", 1, 1, true);
}

void solve(int rank, int, const Row& row) {
    int value = rank == 0 ? valuesOf<int>(row).at(0) : 0;
    MPI_Bcast(&value, 1, MPI_INT, 0, MPI_COMM_WORLD);
    if (rank != 0) answer(rank, std::to_string(value));
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin30. MPI_Bcast: число от ранга 0 всем остальным.",
                 InputRanks::root, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
