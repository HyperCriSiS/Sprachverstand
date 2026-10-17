#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>

// Diagnostic only: no file contents, pointers, filenames or PFNs are printed.
// PROT_NONE + no MAP_POPULATE leaves the queried file page untouched.
static int resident(int fd, off_t offset, long page, unsigned char *out) {
  void *mapping = mmap(NULL, (size_t)page, PROT_NONE, MAP_SHARED, fd, offset);
  if (mapping == MAP_FAILED) return 1;
  int failed = mincore(mapping, (size_t)page, out) != 0;
  if (munmap(mapping, (size_t)page) != 0) failed = 1;
  return failed;
}

int main(int argc, char **argv) {
  long page = sysconf(_SC_PAGESIZE);
  if (page != 4096) return 2;
  if (argc == 2 && strcmp(argv[1], "--self-test") == 0) {
    char name[] = "/tmp/sprachverstand-mincore-XXXXXX";
    int fd = mkstemp(name);
    if (fd < 0) return 3;
    int failed = unlink(name) != 0 || ftruncate(fd, page) != 0;
    unsigned char before = 0, after = 0;
    if (!failed) failed = resident(fd, 0, page, &before);
    void *mapping = MAP_FAILED;
    if (!failed) {
      mapping = mmap(NULL, (size_t)page, PROT_READ, MAP_SHARED, fd, 0);
      failed = mapping == MAP_FAILED;
    }
    if (!failed) {
      volatile unsigned char value = *(volatile unsigned char *)mapping;
      (void)value;
      failed = resident(fd, 0, page, &after);
      if (munmap(mapping, (size_t)page) != 0) failed = 1;
    }
    if (close(fd) != 0) failed = 1;
    if (failed || (before & 1) || !(after & 1)) return 4;
    puts("owned-file mincore untouched/touched controls passed");
    return 0;
  }
  if (argc == 3 && strcmp(argv[1], "--discard-owned") == 0) {
    if (argv[2][0] != '/') return 10;
    int fd = open(argv[2], O_RDWR | O_CLOEXEC | O_NOFOLLOW);
    if (fd < 0) return 11;
    struct stat st;
    int failed = fstat(fd, &st) || !S_ISREG(st.st_mode) ||
      st.st_uid != geteuid() || st.st_nlink != 1;
    if (!failed) failed = fsync(fd) != 0;
    if (!failed) failed = posix_fadvise(fd, 0, 0, POSIX_FADV_DONTNEED) != 0;
    if (close(fd) != 0) failed = 1;
    if (failed) return 12;
    puts("owned-file discard requested");
    return 0;
  }
  if (argc != 3 || argv[1][0] != '/' || argv[2][0] == '-') return 5;
  errno = 0;
  char *end = NULL;
  unsigned long long parsed = strtoull(argv[2], &end, 16);
  if (errno || end == argv[2] || *end || parsed > INT64_MAX) return 6;
  off_t offset = (off_t)(parsed / (unsigned long long)page * (unsigned long long)page);
  int fd = open(argv[1], O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
  if (fd < 0) return 7;
  struct stat st;
  // On Linux, ownership is needed for truthful mincore results. Reject other files.
  if (fstat(fd, &st) || !S_ISREG(st.st_mode) || st.st_uid != geteuid() ||
      offset < 0 || offset >= st.st_size) {
    close(fd);
    return 8;
  }
  unsigned char value = 0;
  int failed = resident(fd, offset, page, &value);
  if (close(fd) != 0) failed = 1;
  if (failed) return 9;
  puts((value & 1) ? "1" : "0");
  return 0;
}
