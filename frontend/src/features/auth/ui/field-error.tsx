export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-sm leading-5 text-destructive">{message}</p>
  ) : null;
}
