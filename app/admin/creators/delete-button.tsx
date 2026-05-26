"use client";

import { useState } from "react";
import { deleteCreatorAction } from "../actions";
import { useRouter } from "next/navigation";

export function DeleteCreatorButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this creator? This will also remove them from Algolia.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteCreatorAction(id);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to delete creator.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
