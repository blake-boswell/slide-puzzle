import FlatQueue from 'flatqueue';

// This class extends the FlatQueue package to let us see if an id is in the queque

// The FlatQueue interface exposed by the package keeps the id array private, but we
// can access it on the object regardless since it is a field on it.
interface ExposedFlatQueue<T> extends FlatQueue<T> {
  ids: T[];
}

class MinQueue<T> extends FlatQueue<T> {
  constructor() {
    super();
  }

  contains(id: T): boolean {
    return ((this as unknown) as ExposedFlatQueue<T>).ids.includes(id);
  }
}

export default MinQueue;
