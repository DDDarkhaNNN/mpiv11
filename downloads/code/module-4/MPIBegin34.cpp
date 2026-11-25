#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    const size_t count = rank + 2;
    return numbers(label(rank) + std::to_string(count) + " целых чисел: ", count, count, true);
}

void solve(int rank, int size, const Row& row) {
    std::vector<int> send = valuesOf<int>(row);
    std::vector<int> counts(size), offsets(size);
    for (int r = 0, offset = 0; r < size; ++r) {
        counts[r] = r + 2;
        offsets[r] = offset;
        offset += counts[r];
    }
    std::vector<int> received(rank == 0 ? offsets.back() + counts.back() : 0);
    MPI_Gatherv(send.data(), static_cast<int>(send.size()), MPI_INT,
                received.data(), counts.data(), offsets.data(), MPI_INT, 0, MPI_COMM_WORLD);
    if (rank == 0) printValues(rank, received);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin34. MPI_Gatherv: наборы длиной ранг + 2 в главный процесс.",
                 InputRanks::all, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
