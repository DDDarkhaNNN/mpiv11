// MPIBegin24. Попарный обмен вещественными наборами.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return numbers(label(rank) + "введите от 1 до 4 чисел через пробел: ", 1, 4, false);
}

void solve(int rank, int, const Row& row) {
    MPI_Comm comm = MPI_COMM_WORLD;
    double outgoing[4], incoming[4];
    int n = static_cast<int>(row.size());
    if (n < 1 || n > 4) throw std::invalid_argument("N");
    for (int i = 0; i < n; ++i) outgoing[i] = unpackReal(row[i]);
    int partner = (rank % 2 == 0) ? rank + 1 : rank - 1;
    MPI_Status status;
    MPI_Sendrecv(outgoing, n, MPI_DOUBLE, partner, 0, incoming, 4, MPI_DOUBLE,
                 partner, 0, comm, &status);
    int count;
    MPI_Get_count(&status, MPI_DOUBLE, &count);
    Row values;
    for (int i = 0; i < count; ++i) values.push_back(decimal(incoming[i]));
    answer(rank, join(values));
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin24. Попарный обмен вещественными наборами.", InputRanks::all, 2, true, false, readInput, solve};
    return run(argc, argv, task);
}
