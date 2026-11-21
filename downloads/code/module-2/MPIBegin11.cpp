// MPIBegin11. Пересылка вещественных чисел от ранга 0.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int, int size, const Rows&) {
    if (size == 1) return {};
    size_t n = size - 1;
    return numbers("Ранг 0 — введите " + std::to_string(n) +
                   " чисел для рангов 1.." + std::to_string(n) + " по порядку: ", n, n, false);
}

void solve(int rank, int size, const Row& row) {
    MPI_Comm comm = MPI_COMM_WORLD;
    if (rank == 0) {
        for (int dest = 1; dest < size; ++dest) {
            double value = unpackReal(row.at(dest - 1));
            MPI_Send(&value, 1, MPI_DOUBLE, dest, 0, comm);
        }
        if (size == 1) std::cout << "Подчинённых процессов нет.\n";
    } else {
        double received;
        MPI_Status status;
        MPI_Recv(&received, 1, MPI_DOUBLE, 0, 0, comm, &status);
        answer(rank, decimal(received));
    }
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin11. Пересылка вещественных чисел от ранга 0.", InputRanks::root, 1, false, false, readInput, solve};
    return run(argc, argv, task);
}
