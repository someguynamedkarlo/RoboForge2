export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-bold text-red-400">Account Banned</h1>
        <p className="text-gray-400">
          Your account has been banned from RoboForge. If you believe this is a
          mistake, please contact the site administrators.
        </p>
      </div>
    </div>
  );
}
