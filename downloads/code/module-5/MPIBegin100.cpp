#include "console_mpi.hpp"
using namespace console_mpi;

Row readInput(int rank, int, const Rows&) {
    return numbers(label(rank) + "одно целое A: ", 1, 1, true);
}

bool validSize(int size) { return size == 7 || size == 10 || size == 13; }

void solve(int rank, int size, const Row& row) {
    std::vector<std::vector<int>> adjacent(size);
    auto edge = [&](int a, int b) {
        adjacent[a].push_back(b);
        adjacent[b].push_back(a);
    };
    for (int first = 1; first < size; first += 3) {
        edge(first, first + 1);
        edge(first, first + 2);
        edge(first + 1, first + 2);
        edge(0, first + 2);
    }
    std::vector<int> index(size), edges;
    for (int r = 0; r < size; ++r) {
        std::sort(adjacent[r].begin(), adjacent[r].end());
        edges.insert(edges.end(), adjacent[r].begin(), adjacent[r].end());
        index[r] = static_cast<int>(edges.size());
    }
    MPI_Comm graph;
    MPI_Graph_create(MPI_COMM_WORLD, size, index.data(), edges.data(), 0, &graph);
    int graphRank, count;
    MPI_Comm_rank(graph, &graphRank);
    MPI_Graph_neighbors_count(graph, graphRank, &count);
    std::vector<int> neighbors(count);
    MPI_Graph_neighbors(graph, graphRank, count, neighbors.data());
    std::sort(neighbors.begin(), neighbors.end());

    const int value = valuesOf<int>(row).at(0);
    std::vector<int> received(size);
    // Общий порядок рёбер гарантирует, что попарные MPI_Sendrecv не заблокируются.
    for (int a = 0; a < size; ++a) {
        for (int b = a + 1; b < size; ++b) {
            if (graphRank != a && graphRank != b) continue;
            const int other = graphRank == a ? b : a;
            if (!std::binary_search(neighbors.begin(), neighbors.end(), other)) continue;
            MPI_Status status;
            MPI_Sendrecv(&value, 1, MPI_INT, other, 0,
                         &received[other], 1, MPI_INT, other, 0, graph, &status);
        }
    }
    Row result;
    for (int neighbor : neighbors) result.push_back(std::to_string(received[neighbor]));
    answer(rank, join(result));
    MPI_Comm_free(&graph);
}

int main(int argc, char** argv) {
    Task task = {"MPIBegin100. Граф из треугольных лучей: обмен с соседями.",
                 InputRanks::all, 7, false, false, readInput, solve, nullptr, validSize};
    return run(argc, argv, task);
}
