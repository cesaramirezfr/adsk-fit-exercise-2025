import { app } from "./app";
import { PORT } from "./constants";

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
  });
}
