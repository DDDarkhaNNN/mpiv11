#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return numbers(label(rank) + "одно вещественное число: ", 1, 1, false);
}

void solve(int rank, int, const Row& row) {
    MPI_Comm subgroup;
    MPI_Comm_split(MPI_COMM_WORLD, rank % 2, rank, &subgroup);
    double value = valuesOf<double>(row).at(0), result = 0;
    MPI_Reduce(&value, &result, 1, MPI_DOUBLE,
               rank % 2 == 0 ? MPI_MAX : MPI_MIN, 0, subgroup);
    if (rank == 0 || rank == 1) answer(rank, decimal(result));
    MPI_Comm_free(&subgroup);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin75. Максимум чётных и минимум нечётных рангов.",
                 InputRanks::all, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
