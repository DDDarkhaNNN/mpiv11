#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return numbers(label(rank) + "одно вещественное число: ", 1, 1, false);
}

bool validSize(int size) { return size == 8 || size == 12; }

void solve(int rank, int size, const Row& row) {
    int dims[3] = {2, 2, size / 4}, periods[3] = {0, 0, 0};
    MPI_Comm cart, square;
    MPI_Cart_create(MPI_COMM_WORLD, 3, dims, periods, 0, &cart);
    int remain[3] = {1, 1, 0};
    MPI_Cart_sub(cart, remain, &square);
    double value = valuesOf<double>(row).at(0), sum = 0;
    MPI_Allreduce(&value, &sum, 1, MPI_DOUBLE, MPI_SUM, square);
    answer(rank, decimal(sum));
    MPI_Comm_free(&square);
    MPI_Comm_free(&cart);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin92. Сумма в каждой матрице 2 × 2 трёхмерной решётки.",
                 InputRanks::all, 8, false, false, readInput, solve, nullptr, validSize};
    return run(argc, argv, task);
}
