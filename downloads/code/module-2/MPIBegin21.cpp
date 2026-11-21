// MPIBegin21. Пересылка по перестановке адресатов.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows& rows) {
    return numbered(rank, rows, 0, size - 1, "ранг получателя");
}

void solve(int rank, int, const Row& row) {
    MPI_Comm comm = MPI_COMM_WORLD;
    double value = unpackReal(row.at(0)), received;
    int dest = std::stoi(row.at(1));
    MPI_Status status;
    // Порядок локальных операций согласуется с убыванием ранга адресата.
    if (dest == rank) {
        transferSelf(value, received, MPI_DOUBLE, rank, MPI_ANY_SOURCE, status);
    } else if (dest > rank) {
        MPI_Send(&value, 1, MPI_DOUBLE, dest, 0, comm);
        MPI_Recv(&received, 1, MPI_DOUBLE, MPI_ANY_SOURCE, 0, comm, &status);
    } else {
        MPI_Recv(&received, 1, MPI_DOUBLE, MPI_ANY_SOURCE, 0, comm, &status);
        MPI_Send(&value, 1, MPI_DOUBLE, dest, 0, comm);
    }
    answer(rank, decimal(received) + " (отправитель: " + std::to_string(status.MPI_SOURCE) + ")");
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin21. Пересылка по перестановке адресатов.", InputRanks::all, 1, false, true, readInput, solve};
    return run(argc, argv, task);
}
