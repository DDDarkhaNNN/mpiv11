#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    if (rank != 0 && rank != size / 2) return {};
    return numbers(label(rank) + "вещественное A для своей строки: ", 1, 1, false);
}

bool validSize(int size) { return size >= 4 && size % 2 == 0; }

void solve(int rank, int size, const Row& row) {
    int dims[2] = {2, size / 2}, periods[2] = {0, 0};
    MPI_Comm cart, line;
    MPI_Cart_create(MPI_COMM_WORLD, 2, dims, periods, 0, &cart);
    int remain[2] = {0, 1};
    MPI_Cart_sub(cart, remain, &line);
    double value = (rank == 0 || rank == size / 2) ? valuesOf<double>(row).at(0) : 0;
    MPI_Bcast(&value, 1, MPI_DOUBLE, 0, line);
    answer(rank, decimal(value));
    MPI_Comm_free(&line);
    MPI_Comm_free(&cart);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin85. Две строки топологии: рассылка A внутри каждой.",
                 InputRanks::all, 4, false, false, readInput, solve, nullptr, validSize};
    return run(argc, argv, task);
}
