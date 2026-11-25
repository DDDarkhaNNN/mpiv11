#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int size, const Rows&) {
    const size_t count = size * (size + 1) / 2;
    return numbers(label(rank) + std::to_string(count) + " целых чисел; блоки для рангов 0, 1, ... имеют длины 1, 2, ...: ",
                   count, count, true);
}

void solve(int rank, int size, const Row& row) {
    std::vector<int> send = valuesOf<int>(row);
    std::vector<int> sendCounts(size), sendOffsets(size), recvCounts(size, rank + 1), recvOffsets(size);
    for (int r = 0, offset = 0; r < size; ++r) {
        sendCounts[r] = r + 1;
        sendOffsets[r] = offset;
        offset += sendCounts[r];
        recvOffsets[r] = r * (rank + 1);
    }
    std::vector<int> received(size * (rank + 1));
    MPI_Alltoallv(send.data(), sendCounts.data(), sendOffsets.data(), MPI_INT,
                  received.data(), recvCounts.data(), recvOffsets.data(), MPI_INT,
                  MPI_COMM_WORLD);
    printValues(rank, received);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin45. MPI_Alltoallv: в ранг R по R + 1 чисел от каждого.",
                 InputRanks::all, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
