// app/(main)/(routes)/admin/users/page.tsx
// This file is used to handle the admin users page
// It is used to display the users in the admin panel

"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from "@nextui-org/react";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  verified: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <Table aria-label="Users table">
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>ROLE</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>JOINED</TableColumn>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    color={user.role === 'ADMIN' ? 'danger' : 'primary'}
                    variant="flat"
                  >
                    {user.role}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    color={user.verified ? 'success' : 'warning'}
                    variant="dot"
                  >
                    {user.verified ? 'Verified' : 'Pending'}
                  </Chip>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 