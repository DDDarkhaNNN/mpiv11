#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int, int size, const Rows&) {
    const size_t count = (size + 1) / 2;
    return numbers("Ранг 0 — " + std::to_string(count) + " целых чисел для рангов 0, 2, 4, ...: ",
                   count, count, true);
}

void solve(int rank, int size, const Row& row) {
    std::vector<int> evenRanks;
    for (int r = 0; r < size; r += 2) evenRanks.push_back(r);
    MPI_Group worldGroup, evenGroup;
    MPI_Comm_group(MPI_COMM_WORLD, &worldGroup);
    MPI_Group_incl(worldGroup, static_cast<int>(evenRanks.size()), evenRanks.data(), &evenGroup);
    MPI_Comm evenComm;
    MPI_Comm_create(MPI_COMM_WORLD, evenGroup, &evenComm);
    if (evenComm != MPI_COMM_NULL) {
        std::vector<int> send = rank == 0 ? valuesOf<int>(row) : std::vector<int>{};
        int received = 0;
        MPI_Scatter(send.data(), 1, MPI_INT, &received, 1, MPI_INT, 0, evenComm);
        answer(rank, std::to_string(received));
        MPI_Comm_free(&evenComm);
    }
    MPI_Group_free(&evenGroup);
    MPI_Group_free(&worldGroup);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin71. Коммуникатор чётных рангов: рассылка чисел.",
                 InputRanks::root, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
