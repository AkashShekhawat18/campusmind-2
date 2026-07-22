import chromadb
import os

DB_PATH = os.path.join(os.getcwd(), "chroma_data")
client = chromadb.PersistentClient(path=DB_PATH)

print("Collections:")
for col in client.list_collections():
    print(col.name, "Count:", col.count())

try:
    col = client.get_collection("user_2d49d61d_df63_4468_898b_53030d8e6914")
    print("\nDocuments for user 2d49d61d-df63-4468-898b-53030d8e6914:")
    print("Count:", col.count())
    res = col.get()
    print("Metadatas:", res["metadatas"])
except Exception as e:
    print("\nError getting collection:", e)
