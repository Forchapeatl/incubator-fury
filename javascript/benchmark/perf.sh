sudo perf record -F 99 -p 12382 -g -- sleep 10
sudo perf script -i ./perf.data &> ./perf.unfold && ../../fg/stackcollapse-perf.pl perf.unfold &> perf.folded && ../../fg/flamegraph.pl perf.folded > perf.svg