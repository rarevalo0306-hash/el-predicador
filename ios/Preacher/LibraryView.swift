import SwiftUI

struct ReadingDraft: Identifiable {
    let id = UUID()
    var title = ""
    var text = ""
    var source: URL?
}

struct LibraryView: View {
    @ObservedObject var library: ReadingLibrary
    @State private var draft: ReadingDraft?
    @State private var query = ""
    @State private var path: [UUID] = []
    @Environment(\.dismiss) private var dismiss
    var filtered: [Reading] {
        library.readings.filter { query.isEmpty || ($0.title + " " + $0.text).localizedCaseInsensitiveContains(query) }
    }
    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if library.loadFailed, let error = library.error {
                    ContentUnavailableView("No se pudieron cargar tus lecturas", systemImage: "exclamationmark.triangle", description: Text(error))
                } else if library.readings.isEmpty {
                    ContentUnavailableView {
                        Label("Tu lectura, siempre contigo", systemImage: "bookmark")
                    } description: {
                        Text("Escribe tus propias notas y reflexiones. Se guardan en este iPhone; la lectura de LBLA requiere conexión.")
                    } actions: {
                        Button("Añadir lectura") { draft = ReadingDraft() }.buttonStyle(.borderedProminent).foregroundStyle(Color(.systemBackground))
                    }
                } else {
                    List {
                        ForEach(filtered) { reading in
                            NavigationLink(value: reading.id) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(reading.title).font(.headline)
                                    Text(reading.text).font(.body).foregroundStyle(.secondary).lineLimit(2)
                                }.padding(.vertical, 4)
                            }
                        }
                    }
                    .overlay {
                        if filtered.isEmpty { ContentUnavailableView.search(text: query) }
                    }
                }
            }
            .navigationDestination(for: UUID.self) { id in
                if let reading = library.readings.first(where: { $0.id == id }) {
                    ReadingDetail(reading: reading, library: library)
                }
            }
            .onChange(of: library.readings.map(\.id)) { _, ids in
                path.removeAll { !ids.contains($0) }
            }
            .navigationTitle("Mis lecturas")
            .searchable(text: $query, prompt: "Buscar en tus lecturas")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cerrar") { dismiss() } }
                ToolbarItem(placement: .primaryAction) {
                    Button("Añadir lectura", systemImage: "plus") { draft = ReadingDraft() }
                        .disabled(library.loadFailed)
                }
            }
            .sheet(item: $draft) { ReadingEditor(library: library, draft: $0) }
        }
    }
}

struct ReadingEditor: View {
    @ObservedObject var library: ReadingLibrary
    @State var draft: ReadingDraft
    @Environment(\.dismiss) private var dismiss
    @State private var saveError: String?
    var body: some View {
        NavigationStack {
            Form {
                Section("Título o referencia") {
                    TextField("Por ejemplo: Juan 3:16", text: $draft.title)
                        .accessibilityIdentifier("readingTitle")
                }
                Section("Lectura") {
                    TextEditor(text: $draft.text).frame(minHeight: 220)
                        .accessibilityLabel("Texto de la lectura")
                        .accessibilityIdentifier("readingText")
                }
                Section {
                    Text("Se guarda solo en este iPhone, independientemente de la cuenta. Cerrar sesión o eliminar la cuenta web no borra estas notas. Puedes eliminarlas desde Mis lecturas. Al desinstalar la app se eliminan.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Guardar lectura")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancelar") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        if library.save(title: draft.title, text: draft.text, source: draft.source) {
                            dismiss()
                        } else { saveError = library.error }
                    }
                    .disabled(draft.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || draft.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .accessibilityIdentifier("saveReading")
                }
            }
            .alert("No se pudo guardar", isPresented: Binding(get: { saveError != nil }, set: { if !$0 { saveError = nil } })) {
                Button("Aceptar") { saveError = nil }
            } message: { Text(saveError ?? "") }
        }
    }
}

struct ReadingDetail: View {
    let reading: Reading
    @ObservedObject var library: ReadingLibrary
    @Environment(\.dismiss) private var dismiss
    @State private var confirmDelete = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text(reading.title).font(.largeTitle.weight(.semibold)).accessibilityAddTraits(.isHeader)
                Text(reading.text).font(.title3).fontDesign(.serif).lineSpacing(8).textSelection(.enabled)
                if let source = reading.source { Link("Ver fuente", destination: source).font(.body) }
                Text(reading.createdAt, style: .date).font(.footnote).foregroundStyle(.secondary)
            }.frame(maxWidth: 650, alignment: .leading).padding(24).frame(maxWidth: .infinity)
        }
        .navigationTitle("Lectura")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                ShareLink(item: reading.title + "\n\n" + reading.text) { Label("Compartir lectura", systemImage: "square.and.arrow.up") }
                Button("Eliminar lectura", systemImage: "trash", role: .destructive) { confirmDelete = true }
            }
        }
        .confirmationDialog("¿Eliminar esta lectura del iPhone?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Eliminar lectura", role: .destructive) { library.delete(reading) }
        }
    }
}
