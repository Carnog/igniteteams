import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, TextInput } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

import { ButtonIcon } from "@components/ButtonIcon";
import { Filter } from "@components/Filter";
import { Header } from "@components/Header";
import { Highlight } from "@components/Highlight";
import { Input } from "@components/Input";
import { PlayerCard } from "@components/PlayerCard";
import { ListEmpty } from "@components/ListEmpty";
import { Button } from "@components/Button";

import { AppError } from "@utils/AppError";
import { groupRemoveByName } from "@storage/group/groupRemoveByName";
import { PlayerStorageDTO } from "@storage/player/PlayerStorageDTO";
import { playerAddByGroup } from "@storage/player/playerAddByGroup";
import { playerGetByGroupAndTeam } from "@storage/player/playerGetByGroupAndTeam";
import { playerRemoveByGroup } from "@storage/player/playerRemoveByGroup";

import { Container, Form, HeaderList, NumberOfPlayers } from "./styles";
import { Loading } from "@components/Loading";

type RouteParams = {
    group: string
}

export function Players() {
    const [isLoading, setIsLoading] = useState(true);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [team, setTeam] = useState('Time A');
    const [players, setPlayers] = useState<PlayerStorageDTO[]>([]);

    const newPlayerNameInputRef = useRef<TextInput>(null);

    const navigation = useNavigation();

    const route = useRoute();
    const { group } = route.params as RouteParams;

    async function handleAddPlayer() {
        if (newPlayerName.trim().length === 0) {
            return Alert.alert('Nova pessoa', 'Informe o nome da pessoa para adicionar.');
        }

        const newPlayer = {
            name: newPlayerName,
            team: team,
        }

        try {
            await playerAddByGroup(newPlayer, group);

            newPlayerNameInputRef.current?.blur();
            setNewPlayerName('');
            fectchPlayersByTeam();
        } catch (error) {
            if (error instanceof AppError) {
                Alert.alert('Nova pessoa', error.message);
            } else {
                console.log(error);
                Alert.alert('Nova pessoa', 'Não foi possivel adicionar');
            }
        }
    }

    async function fectchPlayersByTeam() {
        try {
            setIsLoading(true);

            const playersByTeam = await playerGetByGroupAndTeam(group, team);
            setPlayers(playersByTeam);
        } catch (error) {
            console.log(error);
            Alert.alert('Pessoas', 'Não foi possivel carregar as pessoas.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handlePlayerRemove(playerName: string) {
        try {
            await playerRemoveByGroup(playerName, group);
            fectchPlayersByTeam();
        } catch (error) {
            console.log(error);
            Alert.alert('Remover pessoa', 'Não foi possivel remover a pessoa.');
        }
    }

    async function groupRemove() {
        try {
            await groupRemoveByName(group);
            navigation.navigate('groups');
        } catch (error) {
            console.log(error);
            Alert.alert('Remover grupo', 'Não foi possível remover o grupo.');
        }
    }

    async function handleGroupRemove() {
        Alert.alert(
            'Remover',
            'Deseja remover o grupo?',
            [
                { text: 'Não', style: 'cancel' },
                { text: 'Sim', onPress: () => groupRemove() }
            ])
    }

    useEffect(() => {
        fectchPlayersByTeam();
    }, [team])

    return (
        <Container>
            <Header showBackButton />

            <Highlight
                title={group}
                subtitle="adicione a galera e separe os times"
            />
            <Form>
                <Input
                    placeholder="Nome da pessoa"
                    autoCorrect={false}
                    onChangeText={setNewPlayerName}
                    value={newPlayerName}
                    inputRef={newPlayerNameInputRef}
                    onSubmitEditing={handleAddPlayer}
                    returnKeyType="done"
                />

                <ButtonIcon icon="add" onPress={handleAddPlayer} />
            </Form>

            <HeaderList>
                <FlatList
                    data={['Time A', 'Time B']}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <Filter
                            title={item}
                            isActive={item === team}
                            onPress={() => setTeam(item)}
                        />
                    )}
                    horizontal
                />
                <NumberOfPlayers>
                    {players.length}
                </NumberOfPlayers>
            </HeaderList>

            {
                isLoading ?
                    <Loading />
                    :
                    <FlatList
                        data={players}
                        keyExtractor={(item) => item.name}
                        renderItem={({ item }) => (
                            <PlayerCard
                                name={item.name}
                                onRemove={() => { handlePlayerRemove(item.name) }}
                            />
                        )}
                        ListEmptyComponent={() => (
                            <ListEmpty
                                message="Não há pessoas nesse time"
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            { paddingBottom: 100 },
                            players.length === 0 && { flex: 1 }
                        ]}
                    />

            }
            <Button
                title="Remover turma"
                type="SECONDARY"
                onPress={handleGroupRemove}
            />

        </Container>
    );
}