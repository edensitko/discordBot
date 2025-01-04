import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define Note interface
export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  isTagged: boolean;
}

// Define context type
interface NotesContextType {
  notes: Note[];
  addNote: (content: string) => void;
  deleteNote: (id: string) => void;
  tagNote: (id: string) => void;
  untagNote: (id: string) => void;
}

// Create context
const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Provider component
export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([
    // Add some initial notes for debugging
    {
      id: Date.now().toString(), // Simple unique ID generation
      content: 'First sample note',
      createdAt: new Date(),
      isTagged: false
    },
    {
      id: Date.now().toString(), // Simple unique ID generation
      content: 'Another sample note',
      createdAt: new Date(),
      isTagged: true
    }
  ]);

  // Debug logging
  // useEffect(() => {
  //   console.log('Notes in context:', notes);
  // }, [notes]);

  const addNote = (content: string) => {
    const newNote: Note = {
      id: Date.now().toString(), // Simple unique ID generation
      content,
      createdAt: new Date(),
      isTagged: false
    };
    setNotes(prevNotes => [...prevNotes, newNote]);
    // console.log('Note added:', newNote);
  };

  const deleteNote = (id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    // console.log('Note deleted. Remaining notes:', prevNotes.filter(note => note.id !== id));
  };

  const tagNote = (id: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, isTagged: true } : note
      )
    );
  };

  const untagNote = (id: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, isTagged: false } : note
      )
    );
  };

  return (
    <NotesContext.Provider 
      value={{ 
        notes, 
        addNote, 
        deleteNote, 
        tagNote, 
        untagNote 
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

// Custom hook to use the notes context
export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
