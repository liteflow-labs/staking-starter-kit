import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center space-y-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 500 500"
            className="size-40"
          >
            <path
              fill="#02b14f"
              d="M326.62,112.66c-2.17-7.23-5.7-13.95-10.74-18.64-73.62,73.74-147.71,147.93-221,221.33,25.07,.02,56.28,.02,75.21-.09,45.69-45.48,95.78-95.19,141.31-140.77,17.52-17.53,22.27-38.34,15.23-61.84Z"
            />
            <path
              fill="#02b14f"
              d="M321.88,350.13c-3.49-11.53-10.62-20.53-19.19-28.67-3.16-3-6.49-6.25-6.49-6.25,0,0,3.45-3.43,6.6-6.57,6.21-6.21,12.25-12.6,18.66-18.59,16.14-15.09,22.83-33.49,19.43-55.29-1.64-10.47-6.06-19.83-12.71-27.01-36.5,36.48-72.51,72.46-108,107.91,29.38,29.47,59.45,59.64,89.73,90.01,13.54-15.84,17.9-35.97,11.99-55.52Z"
            />
            <path fill="#02b14f" d="M309.9,405.65c-.66,.9,.48-.42,0,0h0Z" />
          </svg>
          <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
            Build Something Amazing
          </h1>
          <p className="text-xl text-muted-foreground">
            Empower your projects with Liteflow’s all-in-one tools for NFTs,
            tokens, and PointFi. Launch NFT drops and marketplaces, create and
            manage tokens, and engage your community with quests and staking.
            Start building impactful solutions today.
          </p>

          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            asChild
          >
            <ConnectButton />
          </Button>
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Liteflow. All rights reserved.</p>
      </footer>
    </div>
  );
}
