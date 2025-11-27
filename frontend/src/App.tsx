import { QueryClientProvider } from '@tanstack/react-query';
import ApartmentPricePredictorApp from './components/apartment-price-predictor';
import { queryClient } from './lib/query-client';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApartmentPricePredictorApp />
    </QueryClientProvider>
  );
}

export default App