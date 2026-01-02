import { create } from 'zustand';

interface SearchModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const useSearchModal = create<SearchModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false, searchTerm: "" }), // Đóng thì xóa luôn từ khóa cho sạch
  searchTerm: "",
  setSearchTerm: (term: string) => set({ searchTerm: term }),
}));

export default useSearchModal;