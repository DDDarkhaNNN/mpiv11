// MPIBegin18. Циклический сдвиг целых чисел на один ранг.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return numbers(label(rank) + "одно целое число: ", 1, 1, true);
}

void solve(int rank, int size, const Row& row) {
    MPI_Comm comm = MPI_COMM_WORLD;
    int value = std::stoi(row.at(0)), received;
    int prev = (rank + size - 1) % size, next = (rank + 1) % size;
    MPI_Status status;
    if (size == 1) {
        transferSelf(value, received, MPI_INT, rank, rank, status);
    } else if (rank == 0) {
        MPI_Send(&value, 1, MPI_INT, next, 0, comm);
        MPI_Recv(&received, 1, MPI_INT, prev, 0, comm, &status);
    } else {
        MPI_Recv(&received, 1, MPI_INT, prev, 0, comm, &status);
        MPI_Send(&value, 1, MPI_INT, next, 0, comm);
    }
    answer(rank, std::to_string(received));
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin18. Циклический сдвиг целых чисел на один ранг.", InputRanks::all, 1, false, true, readInput, solve};
    return run(argc, argv, task);
}
