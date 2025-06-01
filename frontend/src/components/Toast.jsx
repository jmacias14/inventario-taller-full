export default function Toast({ mensaje, tipo = "success", visible }) {
  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 max-w-sm w-full rounded-lg px-6 py-4 shadow-lg text-white text-base font-medium
        transition-all duration-500 ease-in-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${tipo === "success" ? "bg-green-600" : "bg-red-600"}
      `}
    >
      {mensaje}
    </div>
  );
}
