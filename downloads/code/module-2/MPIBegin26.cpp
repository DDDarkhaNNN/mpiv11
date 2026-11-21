// MPIBegin26. Упорядочивание чисел по номерам в тегах сообщений.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows& rows) {
    return numbered(rank, rows, 1, size - 1, "порядковый номер");
}

void solve(int rank, int size, const Row& row) {
    MPI_Comm comm = MPI_COMM_WORLD;
    if (rank == 0) {
        Row ordered;
        for (int number = 1; number < size; ++number) {
            double value;
            MPI_Status status;
            MPI_Recv(&value, 1, MPI_DOUBLE, MPI_ANY_SOURCE, number, comm, &status);
            ordered.push_back(decimal(value));
        }
        answer(0, join(ordered));
    } else {
        double value = unpackReal(row.at(0));
        int number = std::stoi(row.at(1));
        MPI_Send(&value, 1, MPI_DOUBLE, 0, number, comm);
    }
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin26. Упорядочивание чисел по номерам в тегах сообщений.", InputRanks::workers, 1, false, false, readInput, solve};
    return run(argc, argv, task);
}
