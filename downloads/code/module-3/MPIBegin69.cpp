// MPIBegin69. Сбор упакованных троек в главном процессе.
#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return mixedTriples(rank, 1, 2,"вещественное");
}

void packTriple(const Row& row, int start, char* packet, int capacity) {
    int position = 0;
    int first = std::stoi(row.at(start + 0));
    MPI_Pack(&first, 1, MPI_INT, packet, capacity, &position, MPI_COMM_WORLD);
    int second = std::stoi(row.at(start + 1));
    MPI_Pack(&second, 1, MPI_INT, packet, capacity, &position, MPI_COMM_WORLD);
    double real = std::stod(row.at(start + 2));
    MPI_Pack(&real, 1, MPI_DOUBLE, packet, capacity, &position, MPI_COMM_WORLD);
}

std::string unpackTriple(char* packet, int capacity) {
    int position = 0;
    int first, second;
    double real;
    MPI_Unpack(packet, capacity, &position, &first, 1, MPI_INT, MPI_COMM_WORLD);
    MPI_Unpack(packet, capacity, &position, &second, 1, MPI_INT, MPI_COMM_WORLD);
    MPI_Unpack(packet, capacity, &position, &real, 1, MPI_DOUBLE, MPI_COMM_WORLD);
    return std::to_string(first) + " " + std::to_string(second) + " " + decimal(real);
}

void solve(int rank, int size, const Row& row) {
    int intBytes, realBytes;
    MPI_Pack_size(1, MPI_INT, MPI_COMM_WORLD, &intBytes);
    MPI_Pack_size(1, MPI_DOUBLE, MPI_COMM_WORLD, &realBytes);
    int width = 2 * intBytes + realBytes;
    std::vector<char> packets(size * width), local(width);
    if (rank != 0) packTriple(row, 0, local.data(), width);
    MPI_Gather(local.data(), width, MPI_BYTE, packets.data(), width, MPI_BYTE, 0, MPI_COMM_WORLD);
    if (rank == 0) {
        Row result;
        for (int r = 1; r < size; ++r) result.push_back(unpackTriple(packets.data() + r * width, width));
        answer(rank, join(result));
    }
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin69. Сбор упакованных троек в главном процессе.", InputRanks::workers, 2, false, false, readInput, solve};
    return run(argc, argv, task);
}
