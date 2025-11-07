import SwiftUI

struct NotesView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var notes: [Note] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddNoteModal = false
    @State private var searchText = ""
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám poznámky...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Header
                        headerSection
                        
                        // Search bar
                        SearchBar(text: $searchText)
                        
                        // Notes list
                        if filteredNotes.isEmpty {
                            emptyStateView
                        } else {
                            notesSection
                        }
                        
                        // Bottom padding for tab bar
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.md)
                }
                .background(DesignSystem.Colors.background)
            }
        }
        .navigationTitle("Poznámky")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddNoteModal = true
                }) {
                    ModernIcon(
                        systemName: "plus",
                        size: 18,
                        color: DesignSystem.Colors.primary
                    )
                }
            }
        }
        .onAppear {
            loadNotes()
        }
        .sheet(isPresented: $showAddNoteModal) {
            AddNoteModal(onNoteAdded: {
                loadNotes()
            })
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Computed Properties
    private var filteredNotes: [Note] {
        if searchText.isEmpty {
            return notes
        } else {
            return notes.filter { note in
                note.title.localizedCaseInsensitiveContains(searchText) ||
                note.content.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        ModernCard {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Poznámky")
                            .font(DesignSystem.Typography.title2)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Sledujte své myšlenky a nápady")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        showAddNoteModal = true
                    }) {
                        Text("Přidat poznámku")
                            .font(DesignSystem.Typography.caption)
                            .fontWeight(.medium)
                            .foregroundColor(DesignSystem.Colors.primary)
                            .padding(.horizontal, DesignSystem.Spacing.md)
                            .padding(.vertical, DesignSystem.Spacing.sm)
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                    .fill(DesignSystem.Colors.primary.opacity(0.1))
                            )
                    }
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Notes Section
    private var notesSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            LazyVStack(spacing: DesignSystem.Spacing.sm) {
                ForEach(filteredNotes, id: \.id) { note in
                    NoteCard(note: note) {
                        loadNotes()
                    }
                }
            }
        }
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        EmptyStateView(
            icon: "note.text",
            title: "Žádné poznámky",
            subtitle: "Začněte přidáváním své první poznámky",
            actionTitle: "Přidat poznámku"
        ) {
            showAddNoteModal = true
        }
    }
    
    // MARK: - Data Loading
    private func loadNotes() {
        Task {
            do {
                let fetchedNotes = try await apiManager.fetchNotes()
                
                await MainActor.run {
                    self.notes = fetchedNotes
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                    self.isLoading = false
                }
            }
        }
    }
}

// MARK: - Note Card Component
struct NoteCard: View {
    let note: Note
    let onUpdate: () -> Void
    
    @State private var showEditModal = false
    
    var body: some View {
        ModernCard {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text(note.title)
                            .font(DesignSystem.Typography.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .lineLimit(2)
                        
                        if let createdAt = note.createdAt {
                            Text(formatDate(createdAt))
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        showEditModal = true
                    }) {
                        ModernIcon(
                            systemName: "pencil",
                            size: 16,
                            color: DesignSystem.Colors.textSecondary
                        )
                    }
                }
                
                // Content
                Text(note.content)
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .lineLimit(3)
                    .multilineTextAlignment(.leading)
            }
            .padding(DesignSystem.Spacing.md)
        }
        .sheet(isPresented: $showEditModal) {
            EditNoteModal(note: note, onNoteUpdated: {
                onUpdate()
            })
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "cs_CZ")
        return formatter.string(from: date)
    }
}

// MARK: - Add Note Modal
struct AddNoteModal: View {
    @Environment(\.dismiss) private var dismiss
    let onNoteAdded: () -> Void
    
    @State private var title = ""
    @State private var content = ""
    @State private var isSubmitting = false
    @State private var errorMessage = ""
    @State private var showError = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: DesignSystem.Spacing.lg) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    Text("Název")
                        .font(DesignSystem.Typography.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    TextField("Zadejte název poznámky", text: $title)
                        .padding(DesignSystem.Spacing.sm)
                        .background(DesignSystem.Colors.surfaceSecondary)
                        .cornerRadius(DesignSystem.CornerRadius.sm)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.textTertiary, lineWidth: 1)
                        )
                }
                
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    Text("Obsah")
                        .font(DesignSystem.Typography.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    TextEditor(text: $content)
                        .frame(minHeight: 120)
                        .padding(DesignSystem.Spacing.sm)
                        .background(DesignSystem.Colors.surfaceSecondary)
                        .cornerRadius(DesignSystem.CornerRadius.sm)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.textTertiary, lineWidth: 1)
                        )
                }
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.lg)
            .navigationTitle("Nová poznámka")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Uložit") {
                        createNote()
                    }
                    .disabled(title.isEmpty || content.isEmpty || isSubmitting)
                }
            }
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func createNote() {
        guard !title.isEmpty && !content.isEmpty else { return }
        
        isSubmitting = true
        
        Task {
            do {
                _ = try await APIManager.shared.createNote(title: title, content: content)
                
                await MainActor.run {
                    dismiss()
                    onNoteAdded()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    isSubmitting = false
                }
            }
        }
    }
}

// MARK: - Edit Note Modal
struct EditNoteModal: View {
    @Environment(\.dismiss) private var dismiss
    let note: Note
    let onNoteUpdated: () -> Void
    
    @State private var title: String
    @State private var content: String
    @State private var isSubmitting = false
    @State private var errorMessage = ""
    @State private var showError = false
    
    init(note: Note, onNoteUpdated: @escaping () -> Void) {
        self.note = note
        self.onNoteUpdated = onNoteUpdated
        self._title = State(initialValue: note.title)
        self._content = State(initialValue: note.content)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: DesignSystem.Spacing.lg) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    Text("Název")
                        .font(DesignSystem.Typography.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    TextField("Zadejte název poznámky", text: $title)
                        .padding(DesignSystem.Spacing.sm)
                        .background(DesignSystem.Colors.surfaceSecondary)
                        .cornerRadius(DesignSystem.CornerRadius.sm)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.textTertiary, lineWidth: 1)
                        )
                }
                
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    Text("Obsah")
                        .font(DesignSystem.Typography.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    TextEditor(text: $content)
                        .frame(minHeight: 120)
                        .padding(DesignSystem.Spacing.sm)
                        .background(DesignSystem.Colors.surfaceSecondary)
                        .cornerRadius(DesignSystem.CornerRadius.sm)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.textTertiary, lineWidth: 1)
                        )
                }
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.lg)
            .navigationTitle("Upravit poznámku")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Uložit") {
                        updateNote()
                    }
                    .disabled(title.isEmpty || content.isEmpty || isSubmitting)
                }
            }
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func updateNote() {
        guard !title.isEmpty && !content.isEmpty else { return }
        
        isSubmitting = true
        
        Task {
            do {
                _ = try await APIManager.shared.updateNote(noteId: note.id, title: title, content: content)
                
                await MainActor.run {
                    dismiss()
                    onNoteUpdated()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    isSubmitting = false
                }
            }
        }
    }
}

// MARK: - Search Bar Component
struct SearchBar: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(DesignSystem.Colors.textSecondary)
            
            TextField("Hledat poznámky...", text: $text)
                .textFieldStyle(PlainTextFieldStyle())
            
            if !text.isEmpty {
                Button(action: {
                    text = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
            }
        }
        .padding(DesignSystem.Spacing.sm)
        .background(DesignSystem.Colors.surfaceSecondary)
        .cornerRadius(DesignSystem.CornerRadius.sm)
        .overlay(
            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                .stroke(DesignSystem.Colors.textTertiary, lineWidth: 1)
        )
    }
}

#Preview {
    NotesView()
}
