// MPIBegin59. По одной тройке целых чисел каждому подчинённому процессу.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    int count = 3 * (size - 1);
    return numbers(label(rank) + "введите " + std::to_string(count) + " целых чисел, по тройке для рангов от 1 до " + std::to_string(size - 1) + ": ", count, count, true);
}

void solve(int rank, int size, const Row& row) {
    MPI_Datatype triple;
    MPI_Type_contiguous(3, MPI_INT, &triple);
    MPI_Type_commit(&triple);
    std::vector<int> source(3 * size), local(3);
    if (rank == 0) {
        auto values = valuesOf<int>(row);
        std::copy(values.begin(), values.end(), source.begin() + 3);
    }
    MPI_Scatter(source.data(), 1, triple, local.data(), 1, triple, 0, MPI_COMM_WORLD);
    MPI_Type_free(&triple);
    if (rank != 0) printValues(rank, local);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin59. По одной тройке целых чисел каждому подчинённому процессу.", InputRanks::root, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
