import ErrorBoundary from "./ErrorBoundary.jsx";

export default function AppWithBoundary({ AppComponent, ...props }) {
  const BoundAppComponent = AppComponent;
  return (
    <ErrorBoundary>
      <BoundAppComponent {...props} />
    </ErrorBoundary>
  );
}
