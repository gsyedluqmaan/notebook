import { MongoClient, Db } from "mongodb";

// if (!process.env.MONGODB_URI) {
//   throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
// }

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://gsyedluqmaan:DE75QUYKdv3fboT2@accuramaincluster.jahccz7.mongodb.net/tenders?retryWrites=true&w=majority&appName=AccuraMainCluster";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export default getDb;
