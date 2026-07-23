import { getDashboardMetrics, getDashboardWeeklySales, getDashboardTopProducts, getDashboardWatchlist } from "./src/modules/dashboard/dashboard.service";

async function test() {
  try {
    console.log("metrics", await getDashboardMetrics());
    console.log("weekly", await getDashboardWeeklySales());
    console.log("top", await getDashboardTopProducts());
    console.log("watchlist", await getDashboardWatchlist());
  } catch (e) {
    console.error(e);
  }
}
test();
