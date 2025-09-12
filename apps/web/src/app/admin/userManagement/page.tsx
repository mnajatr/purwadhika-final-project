"use client";

import { useUsers } from "@/hooks/useUsers";
import Link from "next/link";
import Sidebar from "@/components/admin/sidebar";

export default function UserTable() {
  const { data: users, isLoading, isError } = useUsers();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Konten utama */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-x-auto">
        {isLoading && <p className="text-center py-10">Loading users...</p>}

        {isError && (
          <p className="text-center text-red-500 py-10">
            Gagal memuat data users.
          </p>
        )}

        {!isLoading && !isError && (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left">
                Manage Users
              </h2>
              <Link
                href="/users/create"
                className="bg-indigo-500 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition text-center"
              >
                + Tambah User
              </Link>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
              {users && users.length > 0 ? (
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Full Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-700 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {u.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {u.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {u.role}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {u.profile?.fullName ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(u.createdAt).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-sm text-center space-x-2">
                          <Link
                            href={`/users/${u.id}/edit`}
                            className="text-indigo-600 hover:underline"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/users/${u.id}`}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-6 text-center text-gray-500">No users found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
