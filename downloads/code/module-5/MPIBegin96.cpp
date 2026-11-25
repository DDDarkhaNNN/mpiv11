#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return numbers(label(rank) + "одно вещественное A: ", 1, 1, false);
}

bool validSize(int size) { return size >= 4 && size % 2 == 0; }

void solve(int rank, int size, const Row& row) {
    int dims[2] = {2, size / 2}, periods[2] = {0, 1};
    MPI_Comm cart;
    MPI_Cart_create(MPI_COMM_WORLD, 2, dims, periods, 0, &cart);
    int source, destination;
    MPI_Cart_shift(cart, 1, 1, &source, &destination);
    double value = valuesOf<double>(row).at(0), received = 0;
    MPI_Status status;
    MPI_Sendrecv(&value, 1, MPI_DOUBLE, destination, 0,
                 &received, 1, MPI_DOUBLE, source, 0, cart, &status);
    answer(rank, decimal(received));
    MPI_Comm_free(&cart);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin96. Циклический сдвиг на 1 внутри каждой строки.",
                 InputRanks::all, 4, false, false, readInput, solve, nullptr, validSize};
    return run(argc, argv, task);
}
