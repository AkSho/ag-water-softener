export function PreferredSourceBlock() {
  return (
    <div className="mt-10 mb-4">
      <p className="text-sm text-muted-foreground">
        More answers and resources like these in your Google results, marked as preferred.
      </p>
      <div
        className="mt-3"
        dangerouslySetInnerHTML={{
          __html: '<div google-add-preferred-source-btn data-theme="light"></div>',
        }}
      />
    </div>
  );
}
