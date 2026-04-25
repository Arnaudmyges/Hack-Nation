import { useEffect } from "react";
import { testOllamaParsing, testFallback } from "../tests/testOllama";

useEffect(() => {
  testFallback();
  testOllamaParsing();
}, []);