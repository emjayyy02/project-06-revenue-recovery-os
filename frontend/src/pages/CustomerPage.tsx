import { useParams } from "react-router-dom";

export function CustomerPage() {
  const { id } = useParams();

  return (
    <section>
      <h1>Customer 360</h1>
      <p>Customer ID: {id}</p>
    </section>
  );
}