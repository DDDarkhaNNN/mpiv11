#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int, int size, const Rows&) {
    return numbers("Ранг 0 — " + std::to_string(size) + " вещественных чисел: ",
                   size, size, false);
}

void solve(int rank, int size, const Row& row) {
    std::vector<double> send = rank == 0 ? valuesOf<double>(row) : std::vector<double>{};
    std::vector<int> counts(size, 1), offsets(size);
    for (int r = 0; r < size; ++r) offsets[r] = size - 1 - r;
    double received = 0;
    MPI_Scatterv(send.data(), counts.data(), offsets.data(), MPI_DOUBLE,
                 &received, 1, MPI_DOUBLE, 0, MPI_COMM_WORLD);
    answer(rank, decimal(received));
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin37. MPI_Scatterv: числа в обратном порядке рангов.",
                 InputRanks::root, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
