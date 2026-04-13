import { Button } from "@/components/ui/button";
import { Play, Lock, X } from 'lucide-react';

const ButtonsPage = () => {
    return (
        <div>
        <Button>Inizia</Button>
        <Button variant={"secondary"}>Termina</Button>
        <Button variant={"transparent"}>Smth</Button>
        <Button variant={"danger"}>Danger</Button>
        <Button variant={"option"}>Option</Button>
        <Button variant={"arrow"}>▶︎</Button>
        <Button variant={"arrow"}>◀︎</Button>
        <Button variant={"cross"} size={"icon-lg"}><X /></Button>

        <div className="absolute left-110 top-45 z-3">
            <a href="/story"><Button variant={"play"} size={"play"}>▶︎</Button></a>
        </div>

        <div className="absolute left-160 top-45 z-3">
            <a href="/story"><Button variant={"play"} size={"play"}> <Lock fill="currentColor" /></Button></a>
        </div>
        </div>
    );
};

export default ButtonsPage;