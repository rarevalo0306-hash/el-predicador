import SwiftUI

struct InformationView: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("The Preacher").font(.largeTitle).fontDesign(.serif)
                        Text("El Predicador").font(.title3).foregroundStyle(.secondary)
                        Text("Lee LBLA en línea y guarda referencias. Mis lecturas permite escribir tus propias notas. No incluye descargas de LBLA ni uso de su texto con IA.").font(.body)
                    }.padding(.vertical, 12)
                }
                Section("Notas personales") {
                    Text("Usa Nueva nota para escribir tus reflexiones. Los favoritos bíblicos conservan referencias y requieren conexión para consultar LBLA. No copies el texto licenciado a las notas para usarlo sin conexión.")
                    Text("Estas lecturas son independientes de los guardados de tu cuenta web. Compártelas para conservar una copia antes de desinstalar la app.").foregroundStyle(.secondary)
                }
                Section("Ayuda y privacidad") {
                    Link("Política de privacidad", destination: URL(string: "https://www.thepreacher.app/privacy")!)
                    Link("Términos de uso", destination: URL(string: "https://www.thepreacher.app/terms")!)
                    Link("Ayuda y soporte", destination: URL(string: "https://www.thepreacher.app/support")!)
                    Link("Contactar por correo", destination: URL(string: "mailto:rarevalo0306@gmail.com")!)
                }
                Section {
                    Text("Versión \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0")")
                        .foregroundStyle(.secondary)
                }
            }.navigationTitle("Información")
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cerrar") { dismiss() } } }
        }
    }
}
